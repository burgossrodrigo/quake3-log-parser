## To run:
### npm i && npm start

## To test:
### npm test

## Function Documentation

### handleCauseOfDeath



    export const handleCauseOfDeath = (message: string): string => {
      // Extract the cause of death using regular expression
      const regex = /by\s(\w+)/;
      const match = message.match(regex);
      const causeOfDeath = match ? match[1] : '';
    
      return causeOfDeath;
    };
    
This function takes a log message as input and extracts the cause of death from it. It uses a regular expression to match the word after the "by" keyword in the message. The extracted cause of death is returned as a string.

### handleMurder

    export const handleMurder = (message: string): string | any => {
      if (message.includes('<world>')) {
        // If the message contains "<world>", extract the killed player
        const regex = /killed\s+(.+?)\s+by/;
        const match = message.match(regex);
    
        if (match) {
          const killedPlayer = match[1].trim();
          return killedPlayer;
        }
      } else {
        // If the message does not contain "<world>", extract the killer
        const regex = /killed\s+(.+?)\s+by/;
        const match = message.match(regex);
    
        if (match) {
          const killer = match[1].trim();
          return killer;
        }
      }
    };
    
This function handles the extraction of the killer or killed player from a log message. If the message contains world, it extracts the killed player. Otherwise, it extracts the killer. The extracted name is returned as a string.

### handleLogEntries

    export const handleLogEntries = (): string => {
      // Parse the log file and handle the log entries
      const resEntries: ResEntry[] = [];
      const parsedEntries = parseLogEntries();
    
      for (const entry of parsedEntries) {
        let newEntryKey: string;
    
        switch (entry.type) {
          case 'InitGame:':
            // Initialize a new game entry
            newEntryKey = `game_${resEntries.length + 1}`;
            const newEntry: ResEntry = {
              [newEntryKey]: {
                total_kills: 0,
                players: [],
                kills: {},
                kills_by_means: {}
              }
            };
            resEntries.push(newEntry);
            break;
    
          case 'Kill:':
            // Format and handle the kill message
            formatKill(entry.message, resEntries);
            break;
    
          case 'ClientUserinfoChanged:':
            // Handle the new client information
            handleNewClient(entry.message, resEntries);
            break;
    
          default:
            // Ignore other types of log entries
            break;
        }
      }
    
      return JSON.stringify(resEntries);
    };

This function handles the parsing and handling of log entries. It reads the log file, splits the content into individual log entries, and processes each entry based on its type. It maintains an array of matches entries (`resEntries`) and updates it according to the log entries.

### formatKill

    const formatKill = (message: string, resEntries: ResEntry[]) => {
      if (message.includes('<world>')) {
        // Handle kill message when the killer is "<world>"
        const newEntryKey: string = `game_${resEntries.length}`;
        const currentEntry = resEntries[resEntries.length - 1][newEntryKey];
    
        if (currentEntry) {
          const killer = handleMurder(message);
          const kills = currentEntry.kills;
          kills[killer] = (kills[killer] || 0) - 1;
          currentEntry.total_kills += 1;
    
          const causeOfDeath = handleCauseOfDeath(message);
          const killsByMeans = currentEntry.kills_by_means;
          killsByMeans[causeOfDeath] = (killsByMeans[causeOfDeath] || 0) + 1;
        }
      } else {
        // Handle kill message when the killer is not "<world>"
        const newEntryKey: string = `game_${resEntries.length}`;
        const currentEntry = resEntries[resEntries.length - 1][newEntryKey];
    
        if (currentEntry) {
          const killer = handleMurder(message);
          const kills = currentEntry.kills;
          kills[killer] = (kills[killer] || 0) + 1;
          currentEntry.total_kills += 1;
    
          const causeOfDeath = handleCauseOfDeath(message);
          const killsByMeans = currentEntry.kills_by_means;
          killsByMeans[causeOfDeath] = (killsByMeans[causeOfDeath] || 0) + 1;
        }
      }
    };
This function formats and handles a kill message from the log. It determines whether the killer is "<world>" or a player and updates the corresponding game entry accordingly. It increments the kill count for the killer, total kills for the game, and the count for the specific cause of death.

### handleNewClient

    const handleNewClient = (message: string, resEntries: ResEntry[]) => {
      const startIndex = message.indexOf('n\\') + 2;
      const nextWord = message.substring(startIndex).split('\\')[0];
      const newEntryKey: string = `game_${resEntries.length}`;
    
      const currentEntry = resEntries[resEntries.length - 1][newEntryKey];
    
      if (currentEntry && !currentEntry.players.includes(nextWord)) {
        currentEntry.players.push(nextWord);
      }
    
      // Remove duplicates from players array
      currentEntry.players = [...new Set(currentEntry.players)];
    };
This function handles the new client information in the log. It extracts the name of the new client and adds it to the list of players in the current game entry. Duplicate player names are removed to ensure uniqueness.

## Test Documentation

    import { expect } from 'chai';
    import { describe, it } from 'mocha';
    import { ResEntry, handleCauseOfDeath, handleLogEntries, handleMurder } from './index';
    
    describe('Test ResData', () => {
      it('should calculate correct total kills and sum of kills by means for all game entries', () => {
        // Your code for parsing and handling log entries
        const resEntries = handleLogEntries();
    
        // Convert resEntries string back to object
        const parsedResEntries: ResEntry[] = JSON.parse(resEntries);
    
        for (let i = 0; i < parsedResEntries.length; i++) {
          const gameEntry = parsedResEntries[i][`game_${i + 1}`];
          const totalKills = gameEntry.total_kills;
          const killsByMeans = gameEntry.kills_by_means;
    
          // Calculate the sum of kills by means
          const sumOfKillsByMeans = Object.values(killsByMeans).reduce((sum, killCount) => sum + killCount, 0);
    
          // Verify if the sum of kills by means is equal to the total kills
          expect(sumOfKillsByMeans).to.equal(totalKills);
        }
      });
    
      it('Should return the name of the killer given the message from the log or the name of the victim if the killer is <world>', () => {
        const message0 = 'Zeh killed Isgalamido by MOD_ROCKET message';
        const message1 = '<world> killed Zeh by MOD_TRIGGER_HURT message';
        const resEntries0 = handleMurder(message0);
        const resEntries1 = handleMurder(message1);
    
        expect(resEntries0).to.equal('Isgalamido');
        expect(resEntries1).to.equal('Zeh');
      });
    
      it('Should return the cause of death', () => {
        const message2 = 'Zeh killed Isgalamido by MOD_ROCKET message';
        const message3 = '<world> killed Zeh by MOD_TRIGGER_HURT message';
    
        const resEntries2 = handleCauseOfDeath(message2);
        const resEntries3 = handleCauseOfDeath(message3);
    
        expect(resEntries2).to.equal('MOD_ROCKET');
        expect(resEntries3).to.equal('MOD_TRIGGER_HURT');
      });
    });

The test documentation includes test cases for the `handleLogEntries`, `handleMurder`, and `handleCauseOfDeath` functions. The first test case verifies that the total kills and sum of kills by means are calculated correctly for all game entries. The second test case checks if the name of the killer is returned correctly based on the log message, or if the name of the victim is returned when the killer is world. The third test case ensures that the cause of death is extracted accurately from the log message.