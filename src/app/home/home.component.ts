import { Component, OnInit } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

// camera-module-init-code
import { takePicture, requestPermissions, isAvailable } from "nativescript-camera";

// SQLite
import { DbService } from "../dbService";

// Image picker
import * as imagepicker from "nativescript-imagepicker";
import { ImageAsset } from "tns-core-modules/image-asset/image-asset";

// File system  
import { ImageSource, fromFile } from "tns-core-modules/image-source";
import { path, knownFolders } from "tns-core-modules/file-system";
import { MyImage } from "../image";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {

    // camera-module-photo-code
    private saveToGallery: boolean = true;
    private keepAspectRatio: boolean = true;
    private width: number = 300;
    private height: number = 300;

    // SQLite
    private database: DbService;

    // Image picker
    private imageSrc: any;

    // !!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO - this will be id_note, for testing it is now 1
    private id_note = 1;
    // !!!!!!!!!!!!!!!!!!!!!!!!!

    // Images collection
    public images: Array<MyImage>;

    constructor() {
        this.database = new DbService();
    }

    ngOnInit(): void {
        this.populateImages();
    }

    public onTakePhoto() {
        // TUTORIAL COMBINED => 
        // SAVE PICTURE TO FILE SYSTEM: https://docs.nativescript.org/ns-framework-modules/image-source#save-image-to-png-or-jpg-file
        // SAVING PATH TO SQLITE

        console.log("onTakePhoto()");
        let options = {
            width: this.width,
            height: this.height,
            keepAspectRatio: this.keepAspectRatio,
            saveToGallery: this.saveToGallery
        };
        // if the permission is granted, it is not requested anymore
        requestPermissions()
        .then(ok => {
            takePicture(options)
                .then(imageAsset => {
                    console.log("takePicture() ok");
                    this.saveImage(imageAsset);
                }, error => {
                    console.log("takePicture() error: ", error);
                });
        });
    }

    // camera-module-avai-code
    public onCheckForCamera() {
        let isCameraAvailable = isAvailable();
        console.log("Is camera hardware available: " + isCameraAvailable);
    }
    
    public onSelectSingleTap() {
        let context = imagepicker.create({
            mode: "single"
        });
        this.startSelection(context);
    }

    public onImageLongPress(image: MyImage) {
        dialogs.confirm({
            message: "Do you want to delete this picture?",
            okButtonText: "Delete",
            cancelButtonText: "Cancel"
        }).then(result => {
            // Delete pressed
            if (result) {
                this.deleteImage(image);
            }
        });
    }



    // #region PRIVATE METHODS

    /**
     * populates this.images array with images (for current note (according to this.id_note))
     */
    private populateImages(): any {
        console.log("populateImages()");
        this.images = [];
        // TODO - use this with id_note in final app
        // this.database.fetch(id_note) - images just for current note
        this.database.fetchAll()
        .then(rows => {
            for (let row in rows) {
                let image = new MyImage();
                image.Id = rows[row][0];
                image.Path = rows[row][1];
                image.Id_note = rows[row][2];
                image.Image = <ImageSource> fromFile(image.Path);
                this.images.push(image);
            }
        }, error => {
            console.log("populateImages() error: ", error);
        });
    }

    /**
     * Saves image to file system, saves its apth to SQLite and repopulates the collection of images
     * @param imageAsset 
     */
    private saveImage(imageAsset: ImageAsset): any {
        console.log("Size: " + imageAsset.options.width + "x" + imageAsset.options.height);
        const source = new ImageSource();
        source.fromAsset(imageAsset)
        .then((imageSource: ImageSource) => {
            const folderPath: string = knownFolders.documents().path;
            var miliseconds = (new Date()).getTime();
            const fileName = `P_${miliseconds}.png`;
            const imagePath = path.join(folderPath, fileName);
            console.log("onTakePohoto() => save from asset => filePath: " + imagePath);
            const saved: boolean = imageSource.saveToFile(imagePath, "png");
            if (saved) {
                console.log("Image saved successfully!");
                // saves the image path to database
                this.database.insert(imagePath, this.id_note)
                .then(ok => {
                    // repopulate images
                    console.log("repopulating images");
                    this.populateImages();
                }, error => {
                    console.log("insert() error: " + error);
                });
            }
        }, error => {
            console.log("takePicture() error: ", error);
        });
    }

    /**
     * opens gallery with pictures for selection
     * @param context 
     */
    private startSelection(context) {
        let that = this;

        context
        .authorize()
        .then(() => {
            that.imageSrc = null;
            return context.present();
        })
        .then((selection) => {
            console.log("Selection done: " + JSON.stringify(selection));
            that.imageSrc = selection[0];
            this.saveImage(that.imageSrc);
        }, error => {
            console.log(error);
        });
    }

    /**
     * deletes image from DB and repopulates images collection
     * @param image 
     */
    private deleteImage(image: MyImage): any {
        this.database.delete(image.Id)
        .then(ok => {
            // repopulate images
            console.log("repopulating images");
            this.populateImages();
        }, error => {
            console.log("onImageLongPress() delete failed: ", error);
        });
    }

    // #endregion PRIVATE METHODS

}
