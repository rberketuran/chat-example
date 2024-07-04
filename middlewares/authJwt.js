import jsonwebtoken from 'jsonwebtoken';

verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    jwt.verifyToken(token, process.env.SECRET, (err, decoded) => {
        if(err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        next();
    });
}

const authJwt = {
    verifyToken
};

module.exports = authJwt;