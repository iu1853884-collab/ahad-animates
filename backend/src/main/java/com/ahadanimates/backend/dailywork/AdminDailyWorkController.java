package com.ahadanimates.backend.dailywork;

import com.ahadanimates.backend.dailywork.dto.DailyWorkPageResponse;
import com.ahadanimates.backend.dailywork.dto.DailyWorkRequest;
import com.ahadanimates.backend.dailywork.dto.DailyWorkResponse;
import com.ahadanimates.backend.dailywork.dto.DailyWorkStatusRequest;
import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/daily-work")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminDailyWorkController {

    private final DailyWorkService dailyWorkService;

    public AdminDailyWorkController(DailyWorkService dailyWorkService) {
        this.dailyWorkService = dailyWorkService;
    }

    @GetMapping
    public DailyWorkPageResponse list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return dailyWorkService.listForAdmin(category, status, fromDate, toDate, page, size);
    }

    @GetMapping("/{id}")
    public DailyWorkResponse get(@PathVariable Long id) {
        return dailyWorkService.getForAdmin(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DailyWorkResponse create(@Valid @RequestBody DailyWorkRequest request) {
        return dailyWorkService.create(request);
    }

    @PutMapping("/{id}")
    public DailyWorkResponse update(@PathVariable Long id, @Valid @RequestBody DailyWorkRequest request) {
        return dailyWorkService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public DailyWorkResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody DailyWorkStatusRequest request
    ) {
        return dailyWorkService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        dailyWorkService.delete(id);
    }
}
