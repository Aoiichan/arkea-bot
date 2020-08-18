//Utility module

function getThisDay() {
	let d = new Date();

	let day = ("0" + d.getDate()).slice(-2);
	let month = ("0" + (d.getMonth() + 1)).slice(-2);
	let year = d.getFullYear();

	let Today = (year + "-" + month + "-" + day + "T00:00:00");

	return Today;
}

function ConvertToISO(shortdate) {
	let ISO8601;
	if (shortdate){
		try{
			let sd = shortdate.split(/[.,/]/);
			let day = ("0" + parseInt(sd[0]).toString()).slice(-2);
			let month = ("0" + sd[1].toString()).slice(-2);
			let year = sd[2];
			ISO8601 = (year + "-" + month + "-" + day + "T00:00:00");
		}
		catch(e){console.log(e);}
	}else{
		let t = new Date();
		ISO8601 = t.toISOString();
	}
	return ISO8601;
}

function saveMessage(author, reaction) {
	author.send({
		embed: {
			"color": 0x5a5a5a,
			"timestamp": new Date(),
			"fields": [{
				"name": reaction.message.author.username + " in " + reaction.message.guild + ", #" + reaction.message.channel.name,
				"value": reaction.message.content
			}]
		}
	});
	reaction.remove(author).catch((e) => {
		console.log("Cannot remove reaction: " + e);
	});
}

export {getThisDay, ConvertToISO, saveMessage}
