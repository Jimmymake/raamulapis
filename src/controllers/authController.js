// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import User from "../models/userModel.js";
// import config from "../config/config.js";

// class AuthController {
//   async signup(req, res) {
//     const { username, email, location, phone, password, role = "user"  } = req.body;

//     try {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const newUser = await User.create(
//         username,
//         email,
//         location,
//         phone,
//         hashedPassword,role="user"
//       );

//       // Generate JWT token
//       const token = jwt.sign(
//         { id: newUser.id, username: newUser.username, email: newUser.email },
//         config.jwt.secret,
//         { expiresIn: config.jwt.expiresIn }
//       );

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = newUser;

//       res.status(201).json({
//         message: "User created successfully",
//         user: userWithoutPassword,
//         token,
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Error creating user", error: error.message });
//     }
//   }

//   async login(req, res) {
//     const { username, password } = req.body;

//     try {
//       const user = await User.findByUsername(username);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid credentials" });
//       }

//       // Generate JWT token
//       const token = jwt.sign(
//         { id: user.id, username: user.username, email: user.email },
//         config.jwt.secret,
//         { expiresIn: config.jwt.expiresIn }
//       );

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       res.status(200).json({
//         message: "Login successful",
//         user: userWithoutPassword,
//         token,
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Error logging in", error: error.message });
//     }
//   }
// }

// export default new AuthController();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import config from "../config/config.js";

class AuthController {
  async signup(req, res) {
    const { username, email, location, phone, password, role = "user" } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create(
        username,
        email,
        location,
        phone,
        hashedPassword,
        role
      );

      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "User created successfully",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error: error.message });
    }
  }

  async login(req, res) {
    const { username, password } = req.body;

    try {
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error: error.message });
    }
  }
}

export default new AuthController();