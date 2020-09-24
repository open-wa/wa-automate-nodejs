Whatsva Contributes fix the sessions invalid. retrying

in file wapi.js change

     - { id: "bp", conditions: (module) => (module.default&&module.default.toString().includes('bp_unknown_version')) ? module.default : null },
     + { id: 'Perfil',conditions: (module) => module.__esModule === true && module.setPushname && !module.getComposeContents? module  : null,},
        

    - if(!Store.Versions.default[12].BinaryProtocol) Store.Versions.default[12].BinaryProtocol=new Store.bp(Store.Me.binVersion);
    - return await Store.Versions.default[12].setPushname(newName);
    + return await window.Store.Perfil.setPushname(newName);

