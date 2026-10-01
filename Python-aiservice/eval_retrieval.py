"""
eval_retrieval.py
------------------
Measures retrieval quality against a small, hand-labeled set of questions.
For each question, checks whether any of the known-correct files shows up
in the search results, and reports standard information-retrieval metrics:

  Recall@1  - correct file was the very top result
  Recall@5  - correct file was anywhere in the top 5
  MRR       - mean reciprocal rank (1/rank, averaged; rewards ranking higher,
              not just "found somewhere")

Usage:
  python eval_retrieval.py testset.json
  python eval_retrieval.py testset.json --compare     # also runs vector-only
                                                        # search for a before/after

testset.json: a list of {"project_id", "question", "expected_files"} objects.
A question counts as a hit if ANY chunk from ANY of its expected_files shows
up in the results (filename match, case-insensitive) - this deliberately
doesn't require the exact right chunk/line, just the right file, since
that's the granularity a person can label by hand without re-reading the
whole codebase.
"""

import sys
import json
import vectorstore


def evaluate(testset, top_k=5, vector_weight=None):
    """
    vector_weight=None uses vectorstore's own default (hybrid). Pass 1.0 to
    force vector-only search, for an apples-to-apples before/after comparison.
    """
    hits_at_1 = 0
    hits_at_5 = 0
    reciprocal_ranks = []
    details = []

    for case in testset:
        project_id = case["project_id"]
        question = case["question"]
        expected = {f.lower() for f in case["expected_files"]}

        kwargs = {"top_k": top_k}
        if vector_weight is not None:
            kwargs["vector_weight"] = vector_weight
        results = vectorstore.search(project_id, question, **kwargs)
        filenames = [r["filename"].lower() for r in results]

        rank = next((i for i, fn in enumerate(filenames, start=1) if fn in expected), None)

        hits_at_1 += rank == 1
        hits_at_5 += rank is not None
        reciprocal_ranks.append(1 / rank if rank else 0)

        details.append({
            "question": question,
            "expected": sorted(expected),
            "found_at_rank": rank,
            "top_results": filenames
        })

    n = len(testset) or 1
    return {
        "total_questions": len(testset),
        "recall_at_1": round(hits_at_1 / n, 3),
        "recall_at_5": round(hits_at_5 / n, 3),
        "mean_reciprocal_rank": round(sum(reciprocal_ranks) / n, 3),
        "details": details
    }


def print_report(title, report):
    print(f"\n=== {title} ({report['total_questions']} questions) ===")
    print(f"Recall@1 (correct file ranked #1):  {report['recall_at_1'] * 100:.1f}%")
    print(f"Recall@5 (correct file in top 5):   {report['recall_at_5'] * 100:.1f}%")
    print(f"Mean Reciprocal Rank:               {report['mean_reciprocal_rank']}")
    print()
    for d in report["details"]:
        status = f"rank {d['found_at_rank']}" if d["found_at_rank"] else "NOT FOUND"
        print(f"  [{status:>9}] {d['question']}")


if __name__ == "__main__":
    args = sys.argv[1:]
    compare = "--compare" in args
    args = [a for a in args if a != "--compare"]
    path = args[0] if args else "testset.json"

    with open(path) as f:
        testset = json.load(f)

    hybrid_report = evaluate(testset)
    print_report("Hybrid search (current)", hybrid_report)

    output = {"hybrid": hybrid_report}

    if compare:
        vector_only_report = evaluate(testset, vector_weight=1.0)
        print_report("Vector-only search (for comparison)", vector_only_report)
        output["vector_only"] = vector_only_report

        print(f"\n=== Summary ===")
        print(f"Recall@5: {vector_only_report['recall_at_5']*100:.1f}% (vector-only) "
              f"-> {hybrid_report['recall_at_5']*100:.1f}% (hybrid)")
        print(f"MRR:      {vector_only_report['mean_reciprocal_rank']} (vector-only) "
              f"-> {hybrid_report['mean_reciprocal_rank']} (hybrid)")

    with open("eval_report.json", "w") as f:
        json.dump(output, f, indent=2)
    print("\nFull report saved to eval_report.json")

