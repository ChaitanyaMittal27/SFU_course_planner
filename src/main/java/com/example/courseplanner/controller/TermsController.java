package com.example.courseplanner.controller;

import com.example.courseplanner.dto.AdminTermDTO;
import com.example.courseplanner.dto.UpdateTermsRequestDTO;
import com.example.courseplanner.entity.Term;
import com.example.courseplanner.repository.TermRepository;
import com.example.courseplanner.service.JwtService;
import com.example.courseplanner.utils.SemesterUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/terms")
public class TermsController {

    private static final Map<String, Integer> TERM_ORDER = Map.of(
        "spring", 1, "summer", 4, "fall", 7
    );

    private final JwtService jwtService;
    private final TermRepository termRepository;

    public TermsController(JwtService jwtService, TermRepository termRepository) {
        this.jwtService = jwtService;
        this.termRepository = termRepository;
    }

    @GetMapping
    public ResponseEntity<List<AdminTermDTO>> getTerms(
        @RequestHeader("Authorization") String authHeader
    ) {
        jwtService.verifyAdmin(authHeader);
        return ResponseEntity.ok(getAllTermsSorted());
    }

    @PutMapping
    @Transactional
    public ResponseEntity<List<AdminTermDTO>> updateTerms(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody UpdateTermsRequestDTO request
    ) {
        jwtService.verifyAdmin(authHeader);

        validate(request);

        List<Term> allTerms = termRepository.findAll();
        for (Term t : allTerms) {
            t.setIsCurrent(false);
            t.setIsEnrolling(false);
        }
        termRepository.saveAll(allTerms);

        Term current = termRepository.findByYearAndTerm(request.getCurrentYear(), request.getCurrentTerm())
            .orElseGet(() -> {
                Term t = new Term(request.getCurrentYear(), request.getCurrentTerm());
                return termRepository.save(t);
            });
        current.setIsCurrent(true);
        termRepository.save(current);

        Term enrolling = termRepository.findByYearAndTerm(request.getEnrollingYear(), request.getEnrollingTerm())
            .orElseGet(() -> {
                Term t = new Term(request.getEnrollingYear(), request.getEnrollingTerm());
                return termRepository.save(t);
            });
        enrolling.setIsEnrolling(true);
        termRepository.save(enrolling);

        return ResponseEntity.ok(getAllTermsSorted());
    }

    private void validate(UpdateTermsRequestDTO req) {
        if (req.getCurrentYear() == null || req.getCurrentTerm() == null
            || req.getEnrollingYear() == null || req.getEnrollingTerm() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All fields are required");
        }

        String ct = req.getCurrentTerm().toLowerCase();
        String et = req.getEnrollingTerm().toLowerCase();

        if (!TERM_ORDER.containsKey(ct) || !TERM_ORDER.containsKey(et)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Term must be spring, summer, or fall");
        }

        if (req.getCurrentYear().equals(req.getEnrollingYear()) && ct.equals(et)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current and enrolling cannot be the same term");
        }

        long currentCode = SemesterUtil.buildSemesterCode(req.getCurrentYear(), ct);
        long enrollingCode = SemesterUtil.buildSemesterCode(req.getEnrollingYear(), et);
        if (enrollingCode <= currentCode) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enrolling term must be after current term");
        }
    }

    private List<AdminTermDTO> getAllTermsSorted() {
        return termRepository.findAll().stream()
            .sorted(Comparator
                .comparing(Term::getYear).reversed()
                .thenComparing(t -> TERM_ORDER.getOrDefault(t.getTerm(), 0), Comparator.reverseOrder()))
            .map(this::toDTO)
            .toList();
    }

    private AdminTermDTO toDTO(Term t) {
        return new AdminTermDTO(
            t.getTermId(),
            t.getYear(),
            t.getTerm(),
            t.getIsCurrent(),
            t.getIsEnrolling(),
            t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null
        );
    }
}
