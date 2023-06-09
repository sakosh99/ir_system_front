import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { map, tap } from "rxjs";
import { animate, style, transition, trigger } from "@angular/animations";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }), animate('0.25s', style({ opacity: 1 }))]
      ),
      transition(':leave',
        [style({ opacity: 1 }), animate('0.25s', style({ opacity: 0 }))]
      )
    ])
  ]
})
export class AppComponent implements OnInit {
  title = 'angular-project';

  datasets: { name: string, id: number }[] = [
    { name: 'qura', id: 0 },
    { name: 'antique', id: 1 }
  ];
  searchResult: { doc_id: number, text: string, score: number }[] = [];
  loading: boolean = false;
  totalCount: number = 0;
  page: number = 1;
  suggestions: { query_id: number, text: string, score: number }[] = []

  searchFormGroup: FormGroup = new FormGroup({
    datasetId: new FormControl(0),
    query: new FormControl(''),
    page: new FormControl(1),
  });

  constructor(private http: HttpClient) {
    this.searchFormGroup.controls['query'].valueChanges.subscribe(() => {
      const params = this.searchFormGroup.value as { datasetId: number, query: string };
      this.http.get(`http://127.0.0.1:${params.datasetId === 0 ? 8080 : 8090}/suggest?` +
          `query=${this.searchFormGroup.controls['query'].value}`).pipe(
        map(res => res as { result: { query_id: number, text: string, score: number }[] }),
        tap(() => {
        }, (err: HttpErrorResponse) => {
          this.suggestions = []
        }
        )
      ).subscribe(res => {
        this.suggestions = res.result
      })
    })
  }

  ngOnInit(): void {
  }

  search(params: { datasetId: number, query: string, page: number }) {
    this.loading = true;
    this.searchResult = [];
    this.http.get(`http://127.0.0.1:${params.datasetId === 0 ? 8080 : 8080}/search?` +
        `query=${params.query}&page=${params.page-1}`).pipe(
      map(res => res as { result: { doc_id: number, text: string, score: number }[], total_count: number }),
      tap(() => {
      }, (err: HttpErrorResponse) => {
        this.totalCount = 0;
        this.loading = false;
        alert("Error: " + err.message);
      }
      )
    ).subscribe((res: { result: { doc_id: number, text: string, score: number }[], total_count: number }) => {
      this.searchResult = res.result;
      this.totalCount = res.total_count;
      this.loading = false;
    })
  }

  suggestionClick(suggestion: { query_id: number; text: string, score: number }) {
    this.suggestions = []
    this.searchFormGroup.setValue({
      ...this.searchFormGroup.value,
      query: suggestion.text
    })
    this.search(this.searchFormGroup.value)
  }

  nextClick() {
    if (this.page + 1 > Math.ceil(this.totalCount / 10)) return
    this.page++
    this.searchFormGroup.controls['page'].setValue(this.page)
    this.search(this.searchFormGroup.value)
  }

  previousClick() {
    if (this.page === 1) return
    this.page--
    this.searchFormGroup.controls['page'].setValue(this.page)
    this.search(this.searchFormGroup.value)
  }
}
