using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;

namespace HundredIt
{
    // progress.sav / caption.sav use the same GameData container as Tears of the
    // Kingdom: a table of (murmur3 hash, value) pairs grouped by type, then a
    // data section for arrays, strings and blobs.
    sealed class SaveFile
    {
        const uint Magic = 0x01020304;

        public byte[] Data;
        public readonly Dictionary<uint, Field> Fields = new Dictionary<uint, Field>();

        public struct Field
        {
            public int Type; // -1 = bool section (first section has no marker)
            public uint Value;
        }

        public static byte[] ReadShared(string path)
        {
            // The emulator may be writing the file right now: open it shared and retry.
            for (int attempt = 0; ; attempt++)
            {
                try
                {
                    using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
                    using (var ms = new MemoryStream())
                    {
                        fs.CopyTo(ms);
                        return ms.ToArray();
                    }
                }
                catch (IOException) when (attempt < 4)
                {
                    Thread.Sleep(150);
                }
            }
        }

        public static SaveFile Read(string path)
        {
            byte[] d = ReadShared(path);
            if (d.Length < 0x28 || BitConverter.ToUInt32(d, 0) != Magic)
                throw new InvalidDataException("Not a save file: " + path);
            int dataOff = (int)Math.Min(BitConverter.ToUInt32(d, 8), (uint)d.Length);
            var s = new SaveFile { Data = d };
            int sec = -1;
            for (int o = 0x28; o + 8 <= dataOff; o += 8)
            {
                uint h = BitConverter.ToUInt32(d, o);
                uint v = BitConverter.ToUInt32(d, o + 4);
                if (h == 0) { sec = (int)v; continue; }
                s.Fields[h] = new Field { Type = sec, Value = v };
            }
            return s;
        }

        public uint Get(uint hash)
        {
            Field f;
            return Fields.TryGetValue(hash, out f) ? f.Value : 0;
        }

        public bool Has(uint hash) { return Fields.ContainsKey(hash); }

        // Sorted, zero-terminated list of u64 placement IDs. Gold Skulltulas and
        // loose Heart Pieces are stored here (present = collected).
        public HashSet<ulong> Keys64(uint listField)
        {
            var set = new HashSet<ulong>();
            Field f;
            if (!Fields.TryGetValue(listField, out f)) return set;
            long o = f.Value;
            while (o >= 0x28 && o + 8 <= Data.Length)
            {
                ulong v = BitConverter.ToUInt64(Data, (int)o);
                if (v == 0) break;
                set.Add(v);
                o += 8;
            }
            return set;
        }

        string CString(uint off)
        {
            if (off == 0 || off >= Data.Length) return "";
            int end = Array.IndexOf(Data, (byte)0, (int)off);
            if (end < 0) return "";
            return Encoding.UTF8.GetString(Data, (int)off, end - (int)off);
        }

        public sealed class CaptionInfo
        {
            public string Location = "";
            public string Age = "";
            public byte[] Image;
        }

        public static CaptionInfo ReadCaption(string path)
        {
            var c = new CaptionInfo();
            if (!File.Exists(path)) return c;
            SaveFile s;
            try { s = Read(path); } catch { return c; }
            foreach (var f in s.Fields.Values)
            {
                if (f.Type == 16) // String64
                {
                    string v = s.CString(f.Value);
                    if (v.Length > 0 && v.IndexOf('/') < 0) c.Location = v;
                    // The scene path ends in the age, e.g. "Market/Market_Adult".
                    else if (v.EndsWith("_Adult", StringComparison.Ordinal)) c.Age = "Adult";
                    else if (v.EndsWith("_Child", StringComparison.Ordinal)) c.Age = "Child";
                }
                else if (f.Type == 18) // Binary: u32 size + bytes (the screenshot JPEG)
                {
                    long o = f.Value;
                    if (o + 4 <= s.Data.Length)
                    {
                        int n = (int)BitConverter.ToUInt32(s.Data, (int)o);
                        if (n > 4 && o + 4 + n <= s.Data.Length && s.Data[o + 4] == 0xFF && s.Data[o + 5] == 0xD8)
                        {
                            c.Image = new byte[n];
                            Buffer.BlockCopy(s.Data, (int)o + 4, c.Image, 0, n);
                        }
                    }
                }
            }
            // Inside Ganon's Castle the save has no age tag, but you can only be there as adult.
            if (c.Age == "" && c.Location.IndexOf("Ganon", StringComparison.OrdinalIgnoreCase) >= 0) c.Age = "Adult";
            if (c.Age == "")
            {
                if (Contains(s.Data, "\0Adult\0")) c.Age = "Adult";
                else if (Contains(s.Data, "\0Child\0")) c.Age = "Child";
            }
            return c;
        }

        static bool Contains(byte[] hay, string needle)
        {
            byte[] n = Encoding.ASCII.GetBytes(needle);
            for (int i = 0; i + n.Length <= hay.Length; i++)
            {
                int j = 0;
                while (j < n.Length && hay[i + j] == n[j]) j++;
                if (j == n.Length) return true;
            }
            return false;
        }
    }
}
