const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts'); // Add this line

const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // Add this line

app.set('layout', 'layout'); // Set default layout to views/layout.ejs

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key_12345',
    resave: false,
    saveUninitialized: true
}));

// Dummy user for demonstration
const dummyUser = {
    username: 'admin',
    password: 'password',
    imageUrl: '/images/user.png'
};

const USERS_DB_PATH = path.join(__dirname, 'users.json');

// Utility functions for user management
function getUsers() {
    if (!fs.existsSync(USERS_DB_PATH)) {
        fs.writeFileSync(USERS_DB_PATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(USERS_DB_PATH);
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2));
}

function findUser(username) {
    const users = getUsers();
    return users.find(u => u.username === username);
}

function addUser(user) {
    const users = getUsers();
    users.push(user);
    saveUsers(users);
}

function authenticateFirebaseToken(req, res, next) {
    const idToken = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];
    console.log (`idToken - ${req.headers.authorization}`)
    req.user = null;
    if (!idToken) {
        console.log (`user - `)
        return next();
        //return res.status(401).send('No token provided');
    }
    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            console.log (`user - ${req.user}`)
            next();
        })
        .catch((error) => {
            //res.status(401).send('Unauthorized');
            next ();
        });
}

// Authentication routes
app.get('/login', authenticateFirebaseToken, (req, res) => {
    res.render('pages/login', { user:req.user ? req.user.email : null ,error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUser(username);
    if (user && user.password === password) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.render('pages/login', { error: 'Invalid credentials' });
    }
});

app.get('/register', authenticateFirebaseToken, (req, res) => {
    res.render('pages/register', { user:req.user ? req.user : null ,error: null });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (findUser(username)) {
        res.render('pages/register', { error: 'Username already exists' });
    } else {
        const newUser = {
            username,
            password,
            imageUrl: '/images/user.png'
        };
        addUser(newUser);
        req.session.user = newUser;
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Home route
app.get('/', authenticateFirebaseToken, (req, res) => {
    res.render('pages/home', { user:req.user ? req.user : null ,error: null });
});

// Phases route
app.get('/phases', authenticateFirebaseToken, (req, res) => {
    // Replace with real data
    res.render('pages/phases', { user:req.user ? req.user : null, phases: ['Phase 1', 'Phase 2'] });
});

// Alarms route
app.get('/alarmes', (req, res) => {
    // Replace with real data
    res.render('pages/alarmes', { user:req.user ? req.user : null, alarmes: ['Alarme 1', 'Alarme 2'] });
});

// Sites route
app.get('/sites', (req, res) => {
    // Replace with real data
    res.render('pages/sites', { user:req.user ? req.user : null, sites: ['Site 1', 'Site 2'] });
});

app.get('/site/:siteName/data', authenticateFirebaseToken, (req, res) => {
    const siteName = req.params.siteName;
    //const jsonData = getDataForSite(siteName); // ta logique de récupération de données
    //const jsonData = [{ nom: "Site A", valeur: 42 }, { nom: "Site B", valeur: 19 }];
    
    res.render('pages/site_data', { user:req.user ? req.user : null, siteName });
});

app.get('/api/site/:siteName/data', authenticateFirebaseToken, async (req, res) => {
    const siteName = req.params.siteName;
  
    // Simule des données — à remplacer par une vraie source (Firebase, MongoDB, etc.)
    const fakeData = [
      { date: '2024-01-01', temperature: 25, pression: 1012 },
      { date: '2024-01-02', temperature: 27, pression: 1015 },
      // ...
    ];
  
    res.json({user:req.user ? req.user : null, data:fakeData});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});