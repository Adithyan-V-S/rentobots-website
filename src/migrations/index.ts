import * as migration_20261122_132532_initial from './20261122_132532_initial';
import * as migration_20261122_132546_check from './20261122_132546_check';

export const migrations = [
  {
    up: migration_20261122_132532_initial.up,
    down: migration_20261122_132532_initial.down,
    name: '20261122_132532_initial',
  },
  {
    up: migration_20261122_132546_check.up,
    down: migration_20261122_132546_check.down,
    name: '20261122_132546_check'
  },
];
