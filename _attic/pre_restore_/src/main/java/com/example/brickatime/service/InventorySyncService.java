package com.example.brickatime.service;

import com.example.brickatime.client.BricklinkClient;
import com.example.brickatime.model.Minifig;
import com.example.brickatime.repository.MinifigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InventorySyncService {

    private static final Logger log = LoggerFactory.getLogger(InventorySyncService.class);

    private final MinifigRepository repo;
    private final BricklinkClient client;

    public InventorySyncService(MinifigRepository repo, BricklinkClient client) {
        this.repo = repo;
        this.client = client;
    }

    /**
     * Pulls inventory from BrickLink, filters minifigs, maps to Minifig, and upserts.
     * Returns count processed (inserted/updated).
     */
    public int syncFromBricklink() {
        log.info("Starting BrickLink sync...");
        List<Map<String, Object>> raw = client.fetchAllInventory(500, 20);
        List<Map<String, Object>> figs = client.filterToMinifigs(raw);

        int count = 0;
        for (Map<String, Object> lot : figs) {
            Minifig m = mapLotToMinifig(lot);
            if (m.getFigNumber() == null && m.getName() == null) continue;
            // naive upsert: if we have id/lotId use it, otherwise fallback by figNumber+myRemark
            Optional<Minifig> existing = Optional.empty();
            if (m.getId() != null) {
                existing = repo.findById(m.getId());
            }
            Minifig toSave = existing.orElse(m);
            // merge some fields
            toSave.setFigNumber(nz(m.getFigNumber(), toSave.getFigNumber()));
            toSave.setName(nz(m.getName(), toSave.getName()));
            toSave.setBricklinkName(nz(m.getBricklinkName(), toSave.getBricklinkName()));
            toSave.setTheme(nz(m.getTheme(), toSave.getTheme()));
            toSave.setPriceAUD(m.getPriceAUD() != null ? m.getPriceAUD() : toSave.getPriceAUD());
            toSave.setQty(m.getQty() > 0 ? m.getQty() : toSave.getQty());
            toSave.setCondition(nz(m.getCondition(), toSave.getCondition()));
            toSave.setStatus(nz(m.getStatus(), toSave.getStatus()));
            toSave.setLotId(nz(m.getLotId(), toSave.getLotId()));
            toSave.setMyDesc(nz(m.getMyDesc(), toSave.getMyDesc()));
            toSave.setMyRemark(nz(m.getMyRemark(), toSave.getMyRemark()));
            toSave.setImage(nz(m.getImage(), toSave.getImage()));

            repo.save(toSave);
            count++;
        }

        log.info("BrickLink sync complete. Upserted {} minifigs.", count);
        return count;
    }

    @SuppressWarnings("unchecked")
    private Minifig mapLotToMinifig(Map<String, Object> lot) {
        Minifig m = new Minifig();

        // lotId
        Object lotId = lot.get("lot_id");
        if (lotId != null) m.setLotId(String.valueOf(lotId));

        // qty
        Object qty = lot.get("quantity");
        if (qty == null) qty = lot.get("qty");
        if (qty instanceof Number) m.setQty(((Number) qty).intValue());
        else if (qty != null) try { m.setQty(Integer.parseInt(String.valueOf(qty))); } catch (Exception ignored) {}

        // price
        Object price = lot.get("unit_price");
        if (price instanceof Number) m.setPriceAUD(((Number) price).doubleValue());
        else if (price != null) try { m.setPriceAUD(Double.parseDouble(String.valueOf(price))); } catch (Exception ignored) {}

        // my remarks/desc
        Object remark = lot.getOrDefault("remarks", lot.get("remark"));
        if (remark != null) m.setMyRemark(String.valueOf(remark));
        Object desc = lot.get("description");
        if (desc != null) m.setMyDesc(String.valueOf(desc));

        // image
        Object img = lot.getOrDefault("image_url", lot.get("image"));
        if (img != null) m.setImage(String.valueOf(img));

        // condition/status
        Object cond = lot.get("new_or_used");
        if (cond != null) m.setCondition(String.valueOf(cond));
        Object status = lot.get("status");
        if (status != null) m.setStatus(String.valueOf(status));

        // item details
        Object itemObj = lot.get("item");
        if (itemObj instanceof Map) {
            Map<String, Object> item = (Map<String, Object>) itemObj;
            Object no = item.get("no");
            if (no != null) m.setFigNumber(String.valueOf(no));
            Object name = item.get("name");
            if (name != null) {
                m.setName(String.valueOf(name));
                m.setBricklinkName(String.valueOf(name));
            }
            Object category = item.get("category_id");
            if (category != null && m.getTheme() == null) {
                m.setTheme(String.valueOf(category)); // you may map IDs to theme names if you like
            }
        }

        return m;
    }

    private static <T> T nz(T a, T b) { return a != null ? a : b; }
}