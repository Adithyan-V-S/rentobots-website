import * as migration_20261122_132532_initial from './20261122_132532_initial';
import * as migration_20261122_132546_check from './20261122_132546_check';
import * as migration_20261122_163405_product_categories from './20261122_163405_product_categories';

export const migrations = [
  {
    up: migration_20261122_132532_initial.up,
    down: migration_20261122_132532_initial.down,
    name: '20261122_132532_initial',
  },
  {
    up: migration_20261122_132546_check.up,
    down: migration_20261122_132546_check.down,
    name: '20261122_132546_check',
  },
  {
    up: migration_20261122_163405_product_categories.up,
    down: migration_20261122_163405_product_categories.down,
    name: '20261122_163405_product_categories'
  },
];
