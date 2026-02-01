const IORedis = require("ioredis");
const crypto = require("crypto");

function buildRedisConn() {
  var redisUrl = process.env.REDIS_URL;
  if (redisUrl && redisUrl.length > 0) {
    return redisUrl + (redisUrl.includes("?") ? "&" : "?") + "family=0";
  }

  var host = process.env.REDIS_HOST;
  var port = process.env.REDIS_PORT;
  var pass = process.env.REDIS_PASSWORD;

  if (!host || !port) return null;

  if (pass && pass.length > 0) {
    return `redis://:${encodeURIComponent(pass)}@${host}:${port}?family=0`;
  }

  return `redis://${host}:${port}?family=0`;
}

var redisConn = buildRedisConn();

var redis = null;
var usingRedis = false;

if (redisConn) {
  try {
    redis = new IORedis(redisConn, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });
    usingRedis = true;

    redis.on("connect", () => {
      console.log("✅ Successfully connected to Redis!");
    });

    redis.on("ready", () => {
      console.log("🚀 Redis is ready to accept commands.");
    });

    redis.on("error", (e) => console.error("Redis error:", e && e.message));
  } catch (err) {
    console.error("Redis init error:", err);
    usingRedis = false;
  }
} else {
  usingRedis = false;
}

function safe_stringify(val) {
  try {
    return JSON.stringify(val);
  } catch (e) {
    return String(val);
  }
}

function safe_parse(val) {
  if (val === null || val === undefined) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

function make_token() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
}

module.exports = {
  is_enabled() {
    return usingRedis && !!redis;
  },

  async acquire_lock(key, ttlSeconds = 120) {
    if (!(usingRedis && redis)) return null;
    var token = make_token();

    try {
      var res = await redis.set(key, token, "NX", "EX", ttlSeconds);
      return res === "OK" ? token : null;
    } catch (err) {
      console.error("Redis acquire_lock error:", err && err.message);
      return null;
    }
  },

  async release_lock(key, token) {
    if (!(usingRedis && redis) || !token) return;

    var script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      await redis.eval(script, 1, key, token);
    } catch (err) {
      console.error("Redis release_lock error:", err && err.message);
    }
  },

  async extend_lock(key, token, ttlSeconds = 120) {
    if (!(usingRedis && redis) || !token) return 0;

    var script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    try {
      return await redis.eval(script, 1, key, token, ttlSeconds);
    } catch (err) {
      console.error("Redis extend_lock error:", err && err.message);
      return 0;
    }
  },

  async get(key) {
    if (!(usingRedis && redis)) return;
    try {
      var v = await redis.get(key);
      return safe_parse(v);
    } catch (err) {
      console.error("Redis get error:", err && err.message);
      return;
    }
  },

  async set(key, val, ttlSeconds = 600) {
    if (!(usingRedis && redis)) return;
    try {
      var s = safe_stringify(val);
      if (ttlSeconds > 0) {
        await redis.set(key, s, "EX", ttlSeconds);
      } else {
        await redis.set(key, s);
      }
      return true;
    } catch (err) {
      console.error("Redis set error:", err && err.message);
      return;
    }
  },

  async del(key) {
    if (!(usingRedis && redis)) return;
    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.error("Redis del error:", err && err.message);
      return;
    }
  },

  async has(key) {
    if (!(usingRedis && redis)) return;
    try {
      var exists = await redis.exists(key);
      return exists === 1;
    } catch (err) {
      console.error("Redis exists error:", err && err.message);
      return;
    }
  },
};