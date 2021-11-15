//Author: Brayden Murphy
//CS 493 Assignment 7
// Adapted from example code provided in course materials for CS 493 

const express = require('express');
const app = express();

const json2html = require('json-to-html');

const {Datastore} = require('@google-cloud/datastore');

const bodyParser = require('body-parser');
const request = require('request');

const datastore = new Datastore();

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const BOAT = "Boat";

const router = express.Router();
const login = express.Router();

const CLIENT_ID = 'jGPlK34s10yEoMFXM7RFmzyo3NxWertG';
const CLIENT_SECRET = 'IPtU-JePD5P1ACVlXwzyAT3ZVOZqRDspZba3FhcL-mPN2B6-QT7O3pO1n2UoyD0O';
const DOMAIN = '493-assignment-7.us.auth0.com';

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
  });

/* ------------- Begin Lodging Model Functions ------------- */
function post_boat(name, type, length, public, owner){
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length, "public": public, "owner":owner};
	return datastore.save({"key":key, "data":new_boat}).then(() => {
        new_boat.id = key.id; 
        return new_boat});
}

function get_boats(owner){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore).filter( item => item.owner === owner );
		});
}

function get_boats_public(){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore).filter ( item => item.public === true);
		});
}

function get_boat(id, owner){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.get(key).then( (data) => {
            return fromDatastore(data[0]);
        }
    );
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', checkJwt, function(req, res){
    //console.log('jwt' + req.user);
    //console.log(JSON.stringify(req.user));
    const boats = get_boats(req.user.name)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

router.get('/unsecure', function(req, res){
    const lodgings = get_lodgings_unprotected()
	.then( (lodgings) => {
        res.status(200).json(lodgings);
    });
});

router.get('/:id', checkJwt, function(req, res){
        console.log('jwt' + req.user);
    const lodgings = get_lodging(req.params.id)
	.then( (lodging) => {
        const accepts = req.accepts(['application/json', 'text/html']);
        if(lodging.owner && lodging.owner !== req.user.name){
            res.status(403).send('Forbidden');
        } else if(!accepts){
            res.status(406).send('Not Acceptable');
        } else if(accepts === 'application/json'){
            res.status(200).json(lodging);
        } else if(accepts === 'text/html'){
            res.status(200).send(json2html(lodging).slice(1,-1));
        } else { res.status(500).send('Content type got messed up!'); }
    });
});

router.post('/', checkJwt, function(req, res){
    post_boat(req.body.name, req.body.type, req.body.length, req.body.public, req.user.sub).then((boat) => {
        res.status(201).json(boat).end(); 
    }); 
});

login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    var options = { method: 'POST',
            url: `https://${DOMAIN}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            body:
             { grant_type: 'password',
               username: username,
               password: password,
               client_id: CLIENT_ID,
               client_secret: CLIENT_SECRET },
            json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

/* ------------- End Controller Functions ------------- */

app.use('/boats', router);
app.use('/login', login);

app.use( function(err, req, res, next){
    if (err.name === 'UnauthorizedError' && req.method=='POST' && req.path=='/boats') {
        res.status(401).send('Missing or invalid JWT'); 
    }
    else if (err.name === 'UnauthorizedError' && req.method=='GET' && req.path=='/boats'){
        get_boats_public().then((boats) => {
            res.status(200).send(boats).end(); 
        })
    }
    next(); 
}); 
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});