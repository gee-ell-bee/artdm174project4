export const Keychain = {
    // APIs & associated keys
    tom: new Keys(null, "w0Ntsu0zxW281gaO8nyj33OXcfgQDqbA"),
};

// constructor for new keys
function Keys(user, pass) {
    this.user = user;
    this.pass = pass;
    this.basicAuth = function(u, p) {
        return btoa(u, ":", p);
    };
};