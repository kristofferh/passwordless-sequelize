import bcrypt from "bcrypt";

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export default class PasswordlessSequelize {
  constructor(model, options) {
    if (!model) {
      throw new Error("You need to pass a model");
    }

    this.options = Object.assign(
      {
        difficulty: 10
      },
      options || {}
    );

    this.model = model;
  }

  /**
   * Checks if the provided token / user id combination exists and is
   * valid in terms of time-to-live. If yes, the method provides the
   * the stored referrer URL if any.
   * @param  {String}   token to be authenticated
   * @param  {String}   uid Unique identifier of an user
   * @param  {Function} callback in the format (error, valid, referrer).
   * In case of error, error will provide details, valid will be false and
   * referrer will be null. If the token / uid combination was not found
   * found, valid will be false and all else null. Otherwise, valid will
   * be true, referrer will (if provided when the token was stored) the
   * original URL requested and error will be null.
   */
  async authenticate(token, uid, callback) {
    if (!token || !uid || !callback) {
      throw new Error("TokenStore:authenticate called with invalid parameters");
    }

    try {
      const modelToken = await this.model.findOne({
        where: { uid: uid }
      });

      if (!modelToken || Date.now() > modelToken.ttl) {
        return callback(null, false, null);
      } else {
        bcrypt.compare(token, modelToken.token, function(err, res) {
          if (err) {
            return callback(err, false, null);
          } else if (res) {
            return callback(null, true, modelToken.origin || "");
          } else {
            return callback(null, false, null);
          }
        });
      }
    } catch (e) {
      return callback(e, false, null);
    }
  }

  /**
   * Stores a new token / user ID combination or updates the token of an
   * existing user ID if that ID already exists. Hence, a user can only
   * have one valid token at a time
   * @param  {String}   token Token that allows authentication of _uid_
   * @param  {String}   uid Unique identifier of an user
   * @param  {Number}   msToLive Validity of the token in ms
   * @param  {String}   originUrl Originally requested URL or null
   * @param  {Function} callback Called with callback(error) in case of an
   * error or as callback() if the token was successully stored / updated
   */
  storeOrUpdate(token, uid, ttl, origin, callback) {
    if (!token || !uid || !ttl || !callback || !isNumber(ttl)) {
      throw new Error(
        "TokenStore:storeOrUpdate called with invalid parameters"
      );
    }

    bcrypt.hash(token, this.options.difficulty, async (err, hashedToken) => {
      if (err) {
        return callback(err);
      }

      try {
        await this.model.upsert({
          token: hashedToken,
          ttl: Date.now() + ttl,
          uid,
          origin
        });
        return callback();
      } catch (e) {
        return callback(e);
      }
    });
  }

  async invalidateUser(uid, callback) {
    if (!uid || !callback) {
      throw new Error(
        "TokenStore:invalidateUser called with invalid parameters"
      );
    }

    try {
      await this.model.destroy({ where: { uid } });
      return callback();
    } catch (e) {
      return callback(e);
    }
  }

  /**
   * Removes and invalidates all tokens
   * @param  {Function} callback Called with callback(error) in case of an
   * error or as callback() otherwise
   */
  async clear(callback) {
    try {
      await this.model.destroy({ truncate: true });
      return callback();
    } catch (e) {
      return callback(e);
    }
  }

  async length(callback) {
    try {
      const num = await this.model.count({ where: {} });
      return callback(null, num);
    } catch (e) {
      return callback(e);
    }
  }
}
