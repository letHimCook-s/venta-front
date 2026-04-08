import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	ChartComponent,
	ApexAxisChartSeries,
	ApexChart,
	ApexXAxis,
	ApexDataLabels,
	ApexTooltip,
	ApexStroke,
	ApexYAxis,
	ApexTitleSubtitle,
	ApexFill,
	ApexLegend,
	ApexNonAxisChartSeries,
	ApexResponsive,
	ApexPlotOptions,
	NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
	series: ApexAxisChartSeries | ApexNonAxisChartSeries;
	chart: ApexChart;
	xaxis: ApexXAxis;
	stroke: ApexStroke;
	tooltip: ApexTooltip;
	dataLabels: ApexDataLabels;
	yaxis: ApexYAxis;
	fill: ApexFill;
	legend: ApexLegend;
	labels: string[];
	colors: string[];
	responsive: ApexResponsive[];
	title: ApexTitleSubtitle;
	plotOptions: ApexPlotOptions;
};

@Component({
	selector: 'app-admin-dashboard-page',
	standalone: true,
	imports: [CommonModule, NgApexchartsModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './dashboard.page.html',
	styleUrl: './dashboard.page.scss'
})
export class AdminDashboardPage {
	@ViewChild('chart') chart!: ChartComponent;
	public salesChartOptions: Partial<ChartOptions>;
	public categoryChartOptions: Partial<ChartOptions>;
	public topProductsChartOptions: Partial<ChartOptions>;

	public kpis = [
		{
			title: 'Ventas Totales',
			value: 'S/ 12,450.00',
			icon: 'cash-outline',
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10',
			trend: '+12.5%',
			trendColor: 'text-emerald-500'
		},
		{
			title: 'Pedidos Hoy',
			value: '48',
			icon: 'cart-outline',
			color: 'text-blue-500',
			bg: 'bg-blue-500/10',
			trend: '+5.2%',
			trendColor: 'text-blue-500'
		},
		{
			title: 'Nuevos Clientes',
			value: '12',
			icon: 'people-outline',
			color: 'text-violet-500',
			bg: 'bg-violet-500/10',
			trend: '+8.1%',
			trendColor: 'text-violet-500'
		},
		{
			title: 'Productos Activos',
			value: '156',
			icon: 'cube-outline',
			color: 'text-amber-500',
			bg: 'bg-amber-500/10',
			trend: '0.0%',
			trendColor: 'text-slate-400'
		}
	];

	public recentOrders = [
		{ id: '#6542', customer: 'Juan Pérez', date: 'Hace 5 min', total: 'S/ 120.00', status: 'Completado', statusClass: 'bg-emerald-100 text-emerald-600' },
		{ id: '#6541', customer: 'María García', date: 'Hace 20 min', total: 'S/ 45.50', status: 'Pendiente', statusClass: 'bg-amber-100 text-amber-600' },
		{ id: '#6540', customer: 'Carlos Ruiz', date: 'Hace 1 hora', total: 'S/ 310.00', status: 'Completado', statusClass: 'bg-emerald-100 text-emerald-600' },
		{ id: '#6539', customer: 'Ana López', date: 'Hace 3 horas', total: 'S/ 89.90', status: 'Cancelado', statusClass: 'bg-rose-100 text-rose-600' },
		{ id: '#6538', customer: 'Roberto Gómez', date: 'Ayer', total: 'S/ 150.00', status: 'Completado', statusClass: 'bg-emerald-100 text-emerald-600' }
	];

	constructor() {
		// Gráfico de Ventas (Area)
		this.salesChartOptions = {
			series: [
				{
					name: 'Ventas',
					data: [31, 40, 28, 51, 42, 109, 100]
				}
			],
			chart: {
				height: 350,
				type: 'area',
				toolbar: {
					show: false
				},
				fontFamily: 'Inter, system-ui, sans-serif'
			},
			dataLabels: {
				enabled: false
			},
			stroke: {
				curve: 'smooth',
				width: 3
			},
			xaxis: {
				type: 'datetime',
				categories: [
					'2026-04-02T00:00:00.000Z',
					'2026-04-03T01:30:00.000Z',
					'2026-04-04T02:30:00.000Z',
					'2026-04-05T03:30:00.000Z',
					'2026-04-06T04:30:00.000Z',
					'2026-04-07T05:30:00.000Z',
					'2026-04-08T06:30:00.000Z'
				],
				labels: {
					style: {
						colors: '#64748b'
					}
				}
			},
			yaxis: {
				labels: {
					style: {
						colors: '#64748b'
					}
				}
			},
			tooltip: {
				x: {
					format: 'dd/MM/yy HH:mm'
				}
			},
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 1,
					opacityFrom: 0.7,
					opacityTo: 0.2,
					stops: [0, 90, 100]
				}
			},
			colors: ['#0ea5e9']
		};

		// Gráfico de Categorías (Donut)
		this.categoryChartOptions = {
			series: [44, 55, 13, 43],
			chart: {
				type: 'donut',
				height: 350,
				fontFamily: 'Inter, system-ui, sans-serif'
			},
			labels: ['Electrónica', 'Hogar', 'Moda', 'Otros'],
			colors: ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'],
			legend: {
				position: 'bottom',
				labels: {
					colors: '#64748b'
				}
			},
			dataLabels: {
				enabled: false
			},
			responsive: [
				{
					breakpoint: 480,
					options: {
						chart: {
							width: 200
						},
						legend: {
							position: 'bottom'
						}
					}
				}
			]
		};

		// Gráfico de Top Productos (Bar)
		this.topProductsChartOptions = {
			series: [
				{
					name: 'Ventas',
					data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
				}
			],
			chart: {
				type: 'bar',
				height: 350,
				toolbar: {
					show: false
				},
				fontFamily: 'Inter, system-ui, sans-serif'
			},
			plotOptions: {
				bar: {
					borderRadius: 4,
					horizontal: true
				}
			},
			dataLabels: {
				enabled: false
			},
			xaxis: {
				categories: [
					'Laptop Pro',
					'Teclado Mecánico',
					'Monitor 4K',
					'Mouse Gamer',
					'Silla Ergonómica',
					'Audífonos BT',
					'Webcam HD',
					'Soporte Laptop',
					'Pad Mouse XL',
					'Hub USB-C'
				],
				labels: {
					style: {
						colors: '#64748b'
					}
				}
			},
			yaxis: {
				labels: {
					style: {
						colors: '#64748b'
					}
				}
			},
			colors: ['#6366f1']
		};
	}
}
