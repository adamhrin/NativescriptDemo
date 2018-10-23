import { Injectable } from '@angular/core';

var Sqlite = require("nativescript-sqlite");

@Injectable()
export class DbService {

    private database: any;

    constructor() {
        (new Sqlite("my.db"))
        .then(db => {
            db.execSQL("CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, imagePath TEXT, id_note INTEGER)")
            .then(id => {
                console.log("create table ok");
                this.database = db;
            }, error => {
                console.log("create table error: ", error);
            })
        }, error => {
            console.log("Open db error: ", error);
        });
    }

    public insert(imagePath: string, id_note: number): any {
        return this.database.execSQL("INSERT INTO images(imagePath, id_note) VALUES (?, ?)", [imagePath, id_note])
        .then(id => {
            console.log("insert successful with id: " + id);
        }, error => {
            console.log("insert error: ", error);
        });
    }

    public delete(id: number): any {
        return this.database.execSQL("DELETE FROM images WHERE id=?", [id])
        .then(id => {
            console.log("delete successful with id: " + id);
        }, error => {
            console.log("delete error: ", error);
        });
    }

    public fetchAll(): any {
        console.log("dbService.fetchAll()", this.database);
        return this.database.all("SELECT * FROM images")
        .then(rows => {
            return rows;
        }, error => {
            console.log("select error: ", error);
        });
    }

    public fetch(id_note: number): any {
        console.log(`dbService.fetch(${id_note})`, this.database);
        return this.database.execSQL("SELECT * FROM images WHERE id_note = ?", [id_note])
        .then(rows => {
            return rows;
        }, error => {
            console.log("select error: ", error);
        });
    }

    
}