//Requirements
import Discord from 'discord.js';
import config from './config.json';
import {getMenuFromArkea, postMenuToDiscord, SetCWeekMenuURL, getEatingTime, toHoliday, getChannelsFromConfig} from './Functions.js';
import {getThisDay, ConvertToISO, saveMessage} from './Utility.js';
import responses from './responses.json';
import schedule from 'node-schedule';
import data from '../json/timetable.json';
import specialData from '../json/poikkeusTimetable.json';


// Needed for async to work
require("babel-core/register");
require("babel-polyfill");

const bot = new Discord.Client();
let channels = []; //can't be fetched yet must wait for bot login

bot.login(config.token)
.catch((e) => {
	console.log(e);
})

//Informs successful login to the console
bot.on('ready', () => {
	console.log('Connected');
	console.log("Bot has started. Logged in as " + bot.user.username + ". Connected to " + bot.guilds.size + " servers");
	bot.user.setGame(config.currentGame);
	channels = getChannelsFromConfig(bot); // fetch the channels where menu should be posted in
});

// get & post the menu to all the channels listed
async function postMenu () {
	let result = await SetCWeekMenuURL(config.restaurantID);
	let day = getThisDay();
	getMenuFromArkea(result, day).then(menu => {
		postMenuToDiscord(channels, menu);
	});	
}

//Schedules, updates every day at 7:00AM. '0 7 * * *' Fetches JSON file from Arkea website and extracts the information. Prints corresponding information for each day.
let j = schedule.scheduleJob(`0 ${config.timeToPost} * * *`, async () => {
	await postMenu();
});



bot.on('message', async (message) => {
	let content = message.content.toLowerCase();
	if (content.substring(0, config.prefix.length) == config.prefix) {
		let args = content.substring(1).split(' ');
		let cmd = args[0];

		//List of awailable commands
		switch(cmd) {
			// Random command, mainly for test purposes
			case 'test':
				message.channel.send("Hello!");
				break;

			// brief command list
			case 'help':
				message.channel.send("Commands: help, test, menu DD/MM/YY, till syys-/talvi-/joulu-/kesäloma.\nBot prefix: " + config.prefix);
				//message.channel.send(message.channel);
				break;
			// feet
			case 'feet':
				message.channel.send(`<@${message.author.id}>, 🍗`);
				break;

			// Fetch & post menu for given day (default today) onto the current channel
			case 'menu':
				let day;
				let curChan = [message.channel]; // as array to not break .forEach in the procedure
				
				// convert date if given, otherwise default to today
				if (args[1]){
					day = ConvertToISO(args[1]);
				} else {day = getThisDay();}
				// get url and post it only to current channel
				let result = await SetCWeekMenuURL(config.restaurantID, day);
				await getMenuFromArkea(result, day).then(menu => {
					postMenuToDiscord(curChan, menu);
				});
				// await getMenu(result, day, message.channel);
				break;
			
			// post time until given holiday
			case 'till':
				if(args[1])
					message.channel.send(toHoliday()(args[1]))
				else
					message.channel.send(toHoliday()())
				break;
			
			// WIP: post eating time for a given class 
			case 'time':
				let atmClass = args[1]
				let special = false
				if(args[2] !== undefined && args[2] === "poikkeus")
					special = true
				let time = ""
				if(special)
					time = getEatingTime(atmClass, specialData)
				else
					time = getEatingTime(atmClass, data)
				message.channel.send(time)
			// debug/test command: posts the menu to ALL CONFIGURED CHANNELS, same way as the scheduled function
			case 'post':
				if ( message.author.id == config.sysadmin){await postMenu();}
				break;
			// shut down the bot
			case 'shutdown':
				if ( message.author.id == config.sysadmin){process.exit(0);}
				break;
		
		}
	}
});

//To "star" message when star reaction is added
bot.on('messageReactionAdd', (reaction, user) => {
	if (reaction.emoji == "⭐" && reaction.message.guild)
		saveMessage(user, reaction)
});
