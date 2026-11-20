def mm3(key, seed=0):
    key = key.encode(); h = seed; c1, c2 = 0xcc9e2d51, 0x1b873593; n = len(key) // 4
    for i in range(n):
        k = int.from_bytes(key[4*i:4*i+4], 'little'); k = (k*c1) & 0xffffffff; k = ((k << 15) | (k >> 17)) & 0xffffffff; k = (k*c2) & 0xffffffff
        h ^= k; h = ((h << 13) | (h >> 19)) & 0xffffffff; h = (h*5 + 0xe6546b64) & 0xffffffff
    t = key[4*n:]; k = 0
    if len(t) >= 3: k ^= t[2] << 16
    if len(t) >= 2: k ^= t[1] << 8
    if len(t) >= 1:
        k ^= t[0]; k = (k*c1) & 0xffffffff; k = ((k << 15) | (k >> 17)) & 0xffffffff; k = (k*c2) & 0xffffffff; h ^= k
    h ^= len(key); h ^= h >> 16; h = (h*0x85ebca6b) & 0xffffffff; h ^= h >> 13; h = (h*0xc2b2ae35) & 0xffffffff; h ^= h >> 16
    return h
