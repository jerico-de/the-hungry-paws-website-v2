const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { getDB } = require("./database");
const { ObjectId } = require("mongodb");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const db = getDB();
        const users = db.collection("users");

        // Check if user already exists by googleId or email
        let user = await users.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
        });

        if (user) {
          // Update googleId if user signed up with email before
          if (!user.googleId) {
            await users.updateOne({ _id: user._id }, { $set: { googleId: profile.id, isVerified: true, updatedAt: new Date() } });
            user.googleId = profile.id;
          }
          return done(null, user);
        }

        // Create new user from Google profile
        const result = await users.insertOne({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          contact: "",
          password: null,
          isAdmin: false,
          isVerified: true,
          needsPassword: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const newUser = await users.findOne({ _id: result.insertedId });
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
