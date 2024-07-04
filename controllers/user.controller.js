import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
});

exports.register = async (req, res) => {
    const { username, password, email } = req.body;
    
    if(!username || !password || !email) {
        return res.status(400).send({ message: 'All fields are required!' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        await db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', username, password, email);
        return res.status(201).send({ message: 'User registered successfully!' });
    } catch(e) {
        return res.status(500).send({ message: e.message });
    }
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if(!username || !password) {
        return res.status(400).send({ message: 'All fields are required!' });
    }

    let user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if(!user) {
        return res.status(404).send({ message: 'User not found!' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if(!passwordIsValid) {
        return res.status(401).send({ message: 'Invalid password!' });
    }

    const token = jsonwebtoken.sign({ id: user.id }, process.env.SECRET, {
        expiresIn: 86400
    });

    res.cookie('token', token, { httpOnly: true });
    return res.status(200).send({ message: 'User logged in successfully!' });
}