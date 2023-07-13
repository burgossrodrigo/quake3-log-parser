import { expect } from 'chai';
import { describe, it } from 'mocha'
import { ResEntry, handleLogEntries, handleMurder } from '.'

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

  it('Should return the name of the killer given the message from the log or MOD_FALLING if the killer is <world>', () => {
    const message0 = 'Zeh killed Isgalamido by MOD_ROCKET message'
    const message1 = '<world> killed Zeh by MOD_TRIGGER_HURT message'
    const resEntries0 = handleMurder(message0);
    const resEntries1 = handleMurder(message1);


    expect(resEntries0).to.equal('Isgalamido');
    expect(resEntries1).to.equal('Zeh');
    
  });
});
