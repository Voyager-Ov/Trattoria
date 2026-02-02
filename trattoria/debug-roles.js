
const { routeAccess } = require('./src/lib/roles');

// Mock data
const adminPath = '/admin/dashboard/reportes';
const employeeRole = 'EMPLEADO';
const adminRole = 'ADMIN';

console.log('--- Debugging Route Access ---');

// Test Case 1: Employee accessing Admin route
const result1 = routeAccess(employeeRole, adminPath);
console.log(`Case 1: Role=${employeeRole}, Path=${adminPath} -> Result: ${result1}`);
if (result1 !== 'REDIRECT_HOME') console.error('FAIL: Expected REDIRECT_HOME');

// Test Case 2: Admin accessing Admin route
const result2 = routeAccess(adminRole, adminPath);
console.log(`Case 2: Role=${adminRole}, Path=${adminPath} -> Result: ${result2}`);
if (result2 !== 'ALLOW') console.error('FAIL: Expected ALLOW');

// Test Case 3: Public route
const publicPath = '/login';
const result3 = routeAccess(null, publicPath);
console.log(`Case 3: Role=null, Path=${publicPath} -> Result: ${result3}`);
if (result3 !== 'ALLOW') console.error('FAIL: Expected ALLOW');

console.log('--- End Debug ---');
