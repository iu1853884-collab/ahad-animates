package com.ahadanimates.backend.dailywork;

import com.ahadanimates.backend.projects.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DailyWorkRepository extends JpaRepository<DailyWorkEntry, Long> {

    @Query("""
            SELECT DISTINCT entry.category FROM DailyWorkEntry entry
            WHERE (:status IS NULL OR entry.status = :status)
            ORDER BY entry.category
            """)
    List<String> findCategories(@Param("status") ProjectStatus status);

    @Query("""
            SELECT entry FROM DailyWorkEntry entry
            WHERE (:category IS NULL OR entry.category = :category)
              AND (:status IS NULL OR entry.status = :status)
              AND (:fromDate IS NULL OR entry.workDate >= :fromDate)
              AND (:toDate IS NULL OR entry.workDate <= :toDate)
            """)
    Page<DailyWorkEntry> findEntries(
            @Param("category") String category,
            @Param("status") ProjectStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query("""
            SELECT entry FROM DailyWorkEntry entry
            WHERE entry.status = :status
              AND (:category IS NULL OR entry.category = :category)
              AND (:fromDate IS NULL OR entry.workDate >= :fromDate)
              AND (:toDate IS NULL OR entry.workDate <= :toDate)
            """)
    Page<DailyWorkEntry> findPublishedEntries(
            @Param("status") ProjectStatus status,
            @Param("category") String category,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
