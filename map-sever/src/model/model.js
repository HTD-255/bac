class user{
    constructor(id,name,password){
        this.id=id;
        this.name=name;
        this.password=password;
    }
}
class ship{
    constructor(id,name){
        this.id=id;
        this.name=name;
    }
}
class location_ship{
    constructor(id,ship_id,lat,lng,time){
        this.id=id;
        this.ship_id=ship_id;
        this.lat=lat;
        this.lng=lng;
        this.time=time;
    }
}
