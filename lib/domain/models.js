var Model = require('LazyBoy');
Model.create_connection({
    url: 'webnote5.iriscouch.com',
    port: '80',
    db: 'core'
    // auth: { // not required
    //   username: 'username',
    //   password: 'awesome_unique_password'
    // },
    // secure:true,
});

Model.define('Note', {
    data: String,
    title: String
});

Model.define('User', {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String
});

module.exports = Model;
/*

class Model {
    Database db;
    int id;
}

class Car: private Model {
    public: 
    String Make;
    String Model;
    
    void Save();
    void Load(int);

};

inline Car::Save(){
    if(this.id == 0)
        db.insert(this);
    else
        db.update(this.id, this)
}

inline void Car::Load(int id){
    Car car = db.Get(id);
    this.Make = car.Make;
    this.Model = car.Model;
}


Car c = new Car();

c.Make = "Acura";
c.Model = "Integra";

c.Save();
/// LOADING

Car c = new Car();
c.Load(3);





******************************
Database Table Car

 ID  Make     Model
_________________________
| 1  Ford      Mustang
| 2  Ford      Ranger
| 3  Acura     Integra
|
|
|
|
|
******************************
*/