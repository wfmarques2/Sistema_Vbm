import { Layout } from "@/components/layout";
import { useServices } from "@/hooks/use-services";
import { format, isSameDay, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: services, isLoading } = useServices();

  const startDate = startOfWeek(selectedDate);
  const endDate = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

  const todaysServices = services?.filter(s => 
    isSameDay(new Date(s.dateTime), selectedDate)
  ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()) || [];

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">Operational Agenda</h2>
        <p className="text-muted-foreground">Daily schedule and timeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium">{format(selectedDate, 'MMMM yyyy')}</span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-muted-foreground py-2">{d}</div>)}
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const hasEvents = services?.some(s => isSameDay(new Date(s.dateTime), day));
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        py-2 rounded-full relative hover:bg-secondary transition-colors
                        ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : ""}
                      `}
                    >
                      {format(day, 'd')}
                      {hasEvents && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
            <h3 className="font-semibold text-primary mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground">
              You have <span className="font-bold text-primary">{todaysServices.length}</span> services scheduled for {format(selectedDate, 'MMM do')}.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">{format(selectedDate, 'EEEE, MMMM do')}</h3>
          
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading schedule...</p>
            ) : todaysServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-border text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>No services scheduled for this day.</p>
              </div>
            ) : (
              todaysServices.map((service) => (
                <div 
                  key={service.id} 
                  className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex gap-4"
                >
                  <div className="flex flex-col items-center justify-center w-16 bg-secondary rounded-lg">
                    <span className="text-sm font-bold text-primary">{format(new Date(service.dateTime), 'HH:mm')}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{service.clientName}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{service.type} Service</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium 
                        ${service.status === 'finished' ? 'bg-green-100 text-green-700' : 
                          service.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-50 text-blue-700'}`
                      }>
                        {service.status.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-2" />
                        <span className="truncate">{service.origin} → {service.destination}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <span className="font-medium mr-1">Driver:</span>
                        {service.driver?.name || "Unassigned"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
