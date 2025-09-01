package com.example.brickatime.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "minifigs")
public class Minifig {

    @Id
    private String id;

    private String figNumber;       // BrickLink "no" (e.g., sw001)
    private String name;            // display name
    private String bricklinkName;   // raw BL name
    private String theme;

    private BigDecimal priceAUD;    // nullable; filled from BL unit_price or your override
    private int qty;                // quantity on hand
    private String condition;       // "N" | "U"
    private String status;
    private Long lotId;
    private String myDesc;
    private String myRemark;

    private String image;           // image url
    private boolean inStock;        // convenience flag

    // getters/setters
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

    public BigDecimal getPriceAUD() { return priceAUD; }
    public void setPriceAUD(BigDecimal priceAUD) { this.priceAUD = priceAUD; }

    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getLotId() { return lotId; }
    public void setLotId(Long lotId) { this.lotId = lotId; }

    public String getMyDesc() { return myDesc; }
    public void setMyDesc(String myDesc) { this.myDesc = myDesc; }

    public String getMyRemark() { return myRemark; }
    public void setMyRemark(String myRemark) { this.myRemark = myRemark; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }
}