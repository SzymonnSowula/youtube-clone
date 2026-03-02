const WhopReact = require('@whop/embedded-components-react-js');
const WhopVanilla = require('@whop/embedded-components-vanilla-js');

console.log('--- React SDK Exports ---');
console.log(Object.keys(WhopReact));
if (WhopReact.Elements) console.log('Elements provider found');

console.log('\n--- Vanilla SDK Exports ---');
console.log(Object.keys(WhopVanilla));

if (WhopVanilla.loadWhopElements) {
  WhopVanilla.loadWhopElements().then(elements => {
    console.log('\n--- WhopElements Instance Props ---');
    console.log(Object.keys(elements));
  }).catch(err => {
    console.log('Error loading elements:', err.message);
  });
}
