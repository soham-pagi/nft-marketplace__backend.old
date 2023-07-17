const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

// Create Express app
const app = express();
app.use(cors());

// Set up the multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder to save the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Use a unique filename for each uploaded file
  },
});

// Set up multer middleware
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://soham:Password01@nftmarketplace.rqnyzcx.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");

    // Define the user schema
    const userSchema = new mongoose.Schema({
      username: {
        type: String,
        required: true,
      },
      metamaskWalletAddress: {
        type: String,
        required: true,
      },
      image: {
        data: Buffer,
        contentType: String,
      },
    });

    // Create the User model based on the user schema
    const User = mongoose.model("User", userSchema);

    // Define a POST route to handle the username, metamaskWalletAddress, and image upload
    app.post("/api/users", upload.single("image"), (req, res) => {
      const { username, walletAddress } = req.body;

      // Check if a user with the same wallet address exists
      User.findOne({ walletAddress })
        .then((existingUser) => {
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
            const newUser = new User({
              username,
              walletAddress,
            });

            if (req.file) {
              // Read the uploaded image file
              const imageFile = req.file;
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
    });

    // Define a GET route to retrieve user information based on wallet address
    app.get("/api/users/:walletAddress", (req, res) => {
      const { walletAddress } = req.params;

      // Find the user document based on the wallet address
      User.findOne({ metamaskWalletAddress: walletAddress })
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
    });

    // Start the server
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
