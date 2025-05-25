// scripts/fix-constraints.js
const { fixSeedingConstraints } = require('../src/utils/database-setup.util');

fixSeedingConstraints()
  .then((success) => {
    console.log(success ? 'Constraints fixed' : 'Failed to fix constraints');
  })
  .catch(console.error);
