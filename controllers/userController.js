const User = require("../models/User");
const fs = require("fs");

// Create or update a user
const createUser = async (req, res) => {
  const { username, metamaskWalletAddress } = req.body;
  console.log({ username, metamaskWalletAddress });

  // Check if a user with the same wallet address exists
  User.findOne({ metamaskWalletAddress })
    .then((existingUser) => {
      console.log({ existingUser });
      if (existingUser) {
        // Update the existing user's username and image
        existingUser.username = username;

        if (req.file) {
          // Read the uploaded image file
          const imageFile = req.file;
          const imageData = fs.readFileSync(imageFile.path);
          existingUser.image.data = imageData;
          existingUser.image.contentType = imageFile.mimetype;
          // Delete the temporary image file after updating the user
          fs.unlinkSync(imageFile.path);
        }

        // Save the updated user document
        existingUser
          .save()
          .then((updatedUser) => {
            console.log("User updated:", updatedUser);
            res.status(200).json(updatedUser);
          })
          .catch((error) => {
            console.error("Error updating user:", error);
            res.status(500).json({ error: "Failed to update user" });
          });
      } else {
        // Create a new user document
        console.log({ here: "else" });

        const newUser = new User({
          username,
          metamaskWalletAddress,
        });
        console.log({ newUser });
        console.log({ file: req.file });

        if (req.file) {
          // Read the uploaded image file
          const imageFile = req.file;
          console.log({ imageFile });
          const imageData = fs.readFileSync(imageFile.path);
          newUser.image = {
            data: imageData,
            contentType: imageFile.mimetype,
          };
          // Delete the temporary image file after saving the user
          fs.unlinkSync(imageFile.path);
        }

        // Save the new user document
        newUser
          .save()
          .then((savedUser) => {
            console.log("User saved:", savedUser);
            res.status(201).json(savedUser);
          })
          .catch((error) => {
            console.error("Error saving user:", error);
            res.status(500).json({ error: "Failed to save user" });
          });
      }
    })
    .catch((error) => {
      console.error("Error finding user:", error);
      res.status(500).json({ error: "Failed to find user" });
    });
};

// Get user by wallet address
const getUserByWalletAddress = async (req, res) => {
  const { metamaskWalletAddress } = req.params;

  // Find the user document based on the wallet address
  User.findOne({ metamaskWalletAddress })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { username, image } = user;
      res.status(200).json({ username, image });
    })
    .catch((error) => {
      console.error("Error retrieving user:", error);
      res.status(500).json({ error: "Failed to retrieve user" });
    });
};

module.exports = { createUser, getUserByWalletAddress };
