<?php

$file = $argv[1] ?? 'coverage.xml';
$report = simplexml_load_file($file, options: LIBXML_NONET);
if ($report === false) {
    throw new RuntimeException('Could not read Clover coverage report.');
}
$metrics = $report->project->metrics;
$coverage = 100 * (int) $metrics['coveredstatements'] / max(1, (int) $metrics['statements']);
printf("PHP line coverage: %.2f%%; rounded-down baseline: %.1f%%\n", $coverage, floor($coverage * 10) / 10);
