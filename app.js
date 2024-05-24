const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing.js");
const path = require("path");
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
main().then(() => {
    console.log("connection successfull to db");
})
    .catch(err => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
    res.send("connection establish");
});

// index route
app.get("/listings", wrapAsync(async (req, res) => {
    const alllistings = await listing.find({});
    res.render("listings/index.ejs", { alllistings });
}));

// new route 
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// show route

app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listings = await listing.findById(id);
    res.render("listings/show.ejs", { listings });
}));

// create route
app.post(
    "/listings",
    wrapAsync(async (req, res, next) => {
        if (!req.body.listing) {
            throw new ExpressError(400, "send valid data for listing");
        }

        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

// edit route 
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listings = await listing.findById(id);
    res.render("listings/edit.ejs", { listings });
}));

//update route
app.post("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// delete route 
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

/* app.get("/testListing", async (req, res) => {
    let sampleListing = new listing({
        title: "My New Villa",
        description: "By The Beach",
        price: 1200,
        location: "Calangute ,Goa",
        country: "India"
    });

    await sampleListing.save();
    console.log("sample is saved");
    res.send("successful");
}); */

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = "500", message = "something went wrong" } = err;
    /*  res.status(statusCode).send(message); */
    res.render("listings/error.ejs");
});

app.listen(8080, () => {
    console.log("listening on port : 8080");
});