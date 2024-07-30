const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const sequelize = require('./util/database');
const User = require('./models/user');

const userRoutes = require('./routes/user');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.use('/', userRoutes);

sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    })
    .catch(err => console.error(`Database sync error`, err));
