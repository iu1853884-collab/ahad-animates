package com.ahadanimates.backend.dailywork;

import com.ahadanimates.backend.common.exception.ResourceNotFoundException;
import com.ahadanimates.backend.dailywork.dto.DailyWorkPageResponse;
import com.ahadanimates.backend.dailywork.dto.DailyWorkRequest;
import com.ahadanimates.backend.dailywork.dto.DailyWorkResponse;
import com.ahadanimates.backend.dailywork.dto.DailyWorkStatusRequest;
import com.ahadanimates.backend.projects.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class DailyWorkService {

    private static final int MAX_PAGE_SIZE = 30;

    private final DailyWorkRepository dailyWorkRepository;

    public DailyWorkService(DailyWorkRepository dailyWorkRepository) {
        this.dailyWorkRepository = dailyWorkRepository;
    }

    @Transactional(readOnly = true)
    public DailyWorkPageResponse listForAdmin(
            String category,
            ProjectStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        validateDateRange(fromDate, toDate);
        Page<DailyWorkResponse> entries = dailyWorkRepository.findEntries(
                        normalize(category),
                        status,
                        fromDate,
                        toDate,
                        pageRequest(page, size)
                )
                .map(DailyWorkResponse::from);
        return DailyWorkPageResponse.from(entries, dailyWorkRepository.findCategories(null));
    }

    @Transactional(readOnly = true)
    public DailyWorkPageResponse listPublished(
            String category,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        validateDateRange(fromDate, toDate);
        Page<DailyWorkResponse> entries = dailyWorkRepository.findPublishedEntries(
                        ProjectStatus.PUBLISHED,
                        normalize(category),
                        fromDate,
                        toDate,
                        pageRequest(page, size)
                )
                .map(DailyWorkResponse::from);
        return DailyWorkPageResponse.from(
                entries,
                dailyWorkRepository.findCategories(ProjectStatus.PUBLISHED)
        );
    }

    @Transactional(readOnly = true)
    public DailyWorkResponse getForAdmin(Long id) {
        return DailyWorkResponse.from(findById(id));
    }

    public DailyWorkResponse create(DailyWorkRequest request) {
        DailyWorkEntry entry = new DailyWorkEntry(
                request.title().trim(),
                request.description().trim(),
                request.workDate(),
                request.category().trim(),
                request.thumbnailUrl().trim(),
                normalize(request.videoUrl()),
                request.status()
        );
        return DailyWorkResponse.from(dailyWorkRepository.save(entry));
    }

    public DailyWorkResponse update(Long id, DailyWorkRequest request) {
        DailyWorkEntry entry = findById(id);
        entry.setTitle(request.title().trim());
        entry.setDescription(request.description().trim());
        entry.setWorkDate(request.workDate());
        entry.setCategory(request.category().trim());
        entry.setThumbnailUrl(request.thumbnailUrl().trim());
        entry.setVideoUrl(normalize(request.videoUrl()));
        entry.setStatus(request.status());
        return DailyWorkResponse.from(dailyWorkRepository.save(entry));
    }

    public DailyWorkResponse updateStatus(Long id, DailyWorkStatusRequest request) {
        DailyWorkEntry entry = findById(id);
        entry.setStatus(request.status());
        return DailyWorkResponse.from(dailyWorkRepository.save(entry));
    }

    public void delete(Long id) {
        dailyWorkRepository.delete(findById(id));
    }

    private DailyWorkEntry findById(Long id) {
        return dailyWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily work entry not found"));
    }

    private PageRequest pageRequest(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page must be zero or greater");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Page size must be greater than zero");
        }
        return PageRequest.of(
                page,
                Math.min(size, MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("workDate"), Sort.Order.desc("id"))
        );
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("Start date must be on or before end date");
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
