const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log("No authorization header provided");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.log("Authorization header does not start with Bearer:", authHeader);
    return res.status(401).json({ error: "Unauthorized: Invalid token format" });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    res.status(401).json({ error: `Invalid token: ${err.message}` });
  }
}

module.exports = authenticate;
