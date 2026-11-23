import * as migration_20261122_132532_initial from './20261122_132532_initial';
import * as migration_20261122_132546_check from './20261122_132546_check';
import * as migration_20261122_163405_product_categories from './20261122_163405_product_categories';
import * as migration_20261123_070117_case_sports from './20261123_070117_case_sports';
import * as migration_20261123_103055_robot_details_link from './20261123_103055_robot_details_link';

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
    name: '20261122_163405_product_categories',
  },
  {
    up: migration_20261123_070117_case_sports.up,
    down: migration_20261123_070117_case_sports.down,
    name: '20261123_070117_case_sports',
  },
  {
    up: migration_20261123_103055_robot_details_link.up,
    down: migration_20261123_103055_robot_details_link.down,
    name: '20261123_103055_robot_details_link'
  },
];
