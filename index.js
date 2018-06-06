const express = require('express');
const app = express();
const bodyParser = require ( 'body-parser' );

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();


/***/const SseStream = require('ssestream')

const Eliza = require('eliza-as-promised');

const cleverbot = require('cleverbot.io');
const api_user = 'dBJGRQfEILzODmNN'
const api_secret ='OejlbyeYbsh3V8hXfvpvDPE6OyYxf2Ss'


app.use ( bodyParser.json() );
app.use ('/static', express.static ( 'public' ));

const bot = new cleverbot(api_user,api_secret);
const eliza = new Eliza();

//const sseStream = new SseStream(req)

bot.setNick('M1tfcvL2')
bot.create( (err, session) => {});

/*** TODO public von react ***/
app.get('/', (req, res) => {
	res.send('Hello World!');
});

/*** API for Cleverbot ***/
app.post ( '/api/cleverbot', (req, res) => {

	(req.body.line) ?
		bot.ask(req.body.line, (err,response)=>{
			res.send(response);

		}) :
		res.send('Please send non empty message!');

});



/*** API for Eliza ***/
app.post ( '/api/eliza', (req, res) => {

	//console.log('>> ' + eliza.getInitial());

	// let Eliza respond
	// will respond with response.final if you're done
	// will respond with response.reply if you still need more therapy
	eliza.getResponse(req.body.line)
	  .then((response) => {
	    if (response.reply) {
	      //console.log('>> ' + response.reply);
		    res.send(response.reply);
	    }
	    if (response.final) {
	      console.log('>> ' + response.final);

		    /* End of session */
		    res.send(response.final + " <<< END >>> ");
	      process.exit(0);
	    }
	  });
})

const askClever = line => {
	bot.ask(line, (err, response) => {

		console.log('Cleverbot: ' + response);
		myEmitter.emit('event', 'Cleverbot: ' + response);
		setTimeout(function(){
		askEliza(response);
		},3000);
	});

}

const askEliza = line => {
	eliza.getResponse(line)
	.then( response => {
		if(response.reply){
		console.log("Eliza: " + response.reply);
			myEmitter.emit('event', "Eliza: " + response.reply);
		askClever(response.reply);
		}
		if (response.final){
			console.log("Eliza: " + response.final  + " END");
			myEmitter.emit('event', 'Eliza: ' + response.final);
			//res.send('Beendet');
		}

	});

}

app.get('/bam', (req,res)=>{
	bot.ask("Do you like bananas?", (err,response) => {
		console.log("Cleverbot: " + response);
		myEmitter.emit('event', "Cleverbot: " + response);
		askEliza(response);
	});
});



app.get('/sse', (req, res) => {
	const sseStream = new SseStream(req)
	sseStream.pipe(res)
	myEmitter.on('event', (el) => {
		sseStream.write({
			event: 'server-time',
			data: el
		})
	})

});


app.listen(3000, () => {
	console.log('Example app listening on port 3000!');
});
