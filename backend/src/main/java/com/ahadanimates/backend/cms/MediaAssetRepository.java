package com.ahadanimates.backend.cms;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {
    List<MediaAsset> findTop100ByOrderByCreatedAtDesc();
}
