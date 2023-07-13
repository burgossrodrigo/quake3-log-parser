import fs from 'fs';

const filePath = './quake3.log';

interface LogEntry {
    timestamp: string;
    type: string;
    message: string;
}

export interface ResEntry {
    [key: string]: ResData;
}

interface ResData {
    total_kills: number
    players: string[]
    kills: {
        [player: string]: number;
    }
    kills_by_means: {
        [means: string]: number;
    }
}

const formatKill = (message: string, resEntries: ResEntry[]) => {
    if (message.includes('<world>')) {
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


export const handleMurder = (message: string): string | any => {
    if (message.includes('<world>')) {
      const regex = /killed\s+(.+?)\s+by/;
      const match = message.match(regex);
  
      if (match) {
        const killedPlayer = match[1].trim()
        return killedPlayer;
      }
    } else {
      const regex = /killed\s+(.+?)\s+by/;
      const match = message.match(regex);
  
      if (match) {
        const killer = match[1].trim();
        return killer;
      }
    }
  };

  export const handleCauseOfDeath = (message: string): string => {
    const regex = /by\s(\w+)/; 
    const match = message.match(regex);
    const causeOfDeath = match ? match[1] : '';
  
  
    return causeOfDeath;
  };

const handleNewClient = (message: string, resEntries: ResEntry[]) => {
    const startIndex = message.indexOf('n\\') + 2;
    const nextWord = message.substring(startIndex).split('\\')[0];
    const newEntryKey: string = `game_${resEntries.length}`;

    const currentEntry = resEntries[resEntries.length - 1][newEntryKey];

    if (currentEntry && !currentEntry.players.includes(nextWord)) {
        currentEntry.players.push(nextWord);
    }

    currentEntry.players = [...new Set(currentEntry.players)];
};

const parseLogEntries = (): LogEntry[] | any => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8')
        let logContent = data;
        const logEntries = logContent.split('\n')
        const parsedLogs: LogEntry[] = [];

        for (const entry of logEntries) {
            let parts = entry.split(' ').map((part) => part.trim())
            const withoutSpace = parts.filter((str: string) => { return str !== '' })
            const timestamp = withoutSpace[0]
            const type = withoutSpace[1]
            const message = withoutSpace.slice(2).join(' ')

            const logEntry: LogEntry = {
                timestamp,
                type,
                message
            };

            parsedLogs.push(logEntry);
        }
        return parsedLogs
    } catch (err) {
        console.error('Error reading file:', err);
    }
};

export const handleLogEntries = () => {
    const resEntries: ResEntry[] = [];
    const parsedEntries = parseLogEntries();

    for (const entry of parsedEntries) {
        let newEntryKey;

        switch (entry.type) {
            case 'InitGame:':
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
                formatKill(entry.message, resEntries);
                break;


            case 'ClientUserinfoChanged:':
                handleNewClient(entry.message, resEntries)
                break;

            default:

                break;
        }
    }

    return JSON.stringify(resEntries, null, 2)
}

console.log(handleLogEntries()) 

