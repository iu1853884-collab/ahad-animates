package com.ahadanimates.backend.projects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "portfolio_seed_state")
public class PortfolioSeedState {

    @Id
    @Column(length = 64)
    private String id;

    protected PortfolioSeedState() {
    }

    public PortfolioSeedState(String id) {
        this.id = id;
    }
}
