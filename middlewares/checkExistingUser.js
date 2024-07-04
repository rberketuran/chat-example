const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
});

export const checkExistingUser = async (req, res, next) => {
    const { username, email } = req.body;

    let user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', username, email);
    if(user) {
        return res.status(400).send({ message: 'User already exists!' });
    }

    next();
}