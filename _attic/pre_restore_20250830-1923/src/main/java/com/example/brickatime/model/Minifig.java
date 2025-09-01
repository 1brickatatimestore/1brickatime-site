package com.example.brickatime.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "minifigs")
public class Minifig {

    @Id
    private String id;

    private String figNumber;
    private String name;
    private String bricklinkName;
    private String theme;
    private Double priceAUD;
    private int qty;
    private String condition;
    private String status;
    private String lotId;
    private String myDesc;
    private String myRemark;
    private String image;

    public Minifig() {}

    public Minifig(String id, String figNumber, String name, String bricklinkName,
                   String theme, Double priceAUD, int qty, String condition,
                   String status, String lotId, String myDesc, String myRemark,
                   String image) {
        this.id = id;
        this.figNumber = figNumber;
        this.name = name;
        this.bricklinkName = bricklinkName;
        this.theme = theme;
        this.priceAUD = priceAUD;
        this.qty = qty;
        this.condition = condition;
        this.status = status;
        this.lotId = lotId;
        this.myDesc = myDesc;
        this.myRemark = myRemark;
        this.image = image;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFigNumber() { return figNumber; }
    public void setFigNumber(String figNumber) { this.figNumber = figNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBricklinkName() { return bricklinkName; }
    public void setBricklinkName(String bricklinkName) { this.bricklinkName = bricklinkName; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public Double getPriceAUD() { return priceAUD; }
    public void setPriceAUD(Double priceAUD) { this.priceAUD = priceAUD; }

    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLotId() { return lotId; }
    public void setLotId(String lotId) { this.lotId = lotId; }

    public String getMyDesc() { return myDesc; }
    public void setMyDesc(String myDesc) { this.myDesc = myDesc; }

    public String getMyRemark() { return myRemark; }
    public void setMyRemark(String myRemark) { this.myRemark = myRemark; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}