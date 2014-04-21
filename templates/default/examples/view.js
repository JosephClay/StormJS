var UserView = new Storm.View.extend(function() {
       console.log(arguments);
});
var userView = new UserView({ template: '{{Name}}' });