const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const rounds = 10;
  
  console.log('Generating bcrypt hash for password:', password);
  console.log('Using rounds:', rounds);
  
  const hash = await bcrypt.hash(password, rounds);
  console.log('\nGenerated hash:');
  console.log(hash);
  
  // Verify the hash works
  const isValid = await bcrypt.compare(password, hash);
  console.log('\nVerification:', isValid ? 'SUCCESS' : 'FAILED');
  
  // Test with the hash we're using
  const currentHash = '$2b$10$F/B3khStv2.U7VanHGVr5OpjydhGrzdQB83Axw8a2UCT0yKaghiXK';
  const isCurrentValid = await bcrypt.compare(password, currentHash);
  console.log('Current hash verification:', isCurrentValid ? 'SUCCESS' : 'FAILED');
  
  console.log('\nSQL to update user:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@realestate.mx';`);
}

generateHash().catch(console.error);