# rizzler
 
this is the discord bot i made that i use in project rizz discord server

## background
blah blah blah made with node js blah blah discord.js

## setup
we need to set variables in `settings.json`<br>
navigate to `src/settings.template.json` and make a copy, call that copy `settings.json`<br>
in that `settings.json` we have to set a few values:

- `token`: ur bot token
- `guildId`: ur server id
- `clientId`: ur bots user id
- `devSecret`: ur playfab developer secret
- `banRoleID`: the id of the role that can ban people ingame
- `titleId`: ur games title id
- `rolesChannel`: id of the channel where people get roles
- `logChannelID`: id of the channel the bot will log in<br>
<b>the log channel is safe to make public, as the logs will not expose private info!</b><br>

---
done with that part, now the easy part!<br>
in your terminal, run these commands:
```bash
npm install // downloads dependecies
npm run build // builds bot
npm run start // starts bot
```
you need to run these at least once and every bot update, but if you already did those you can just do this:
```bash
npm run start
```
but again, it it throws errors, run the top commands again, if it still errors make an [issue](https://github.com/Unixityyy/rizzler/issues)
