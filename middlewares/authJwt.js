import jsonwebtoken from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/api/v1/user/login');
    }

    jsonwebtoken.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id; // Assuming your JWT payload has an 'id' field
        next(); // Call next() only if token is valid
    });
};

export default verifyToken;
